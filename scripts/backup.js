"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const backupDirectory =
    path.resolve(
        __dirname,
        "..",
        "backups"
    );

const timestamp =
    new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

const backupFile =
    path.join(
        backupDirectory,
        `school_management_${timestamp}.dump`
    );

const databaseUrl =
    process.env.DATABASE_URL;

const databaseName =
    process.env.DB_NAME ||
    process.env.DATABASE_NAME ||
    "school_management";

const databaseUser =
    process.env.DB_USER ||
    process.env.DATABASE_USER ||
    "postgres";

const databaseHost =
    process.env.DB_HOST ||
    process.env.DATABASE_HOST ||
    "localhost";

const databasePort =
    process.env.DB_PORT ||
    process.env.DATABASE_PORT ||
    "5432";

function fail(message) {
    console.error(message);
    process.exitCode = 1;
}

function runBackup() {
    fs.mkdirSync(
        backupDirectory,
        {
            recursive: true
        }
    );

    const args = [
        "--format=custom",
        "--file",
        backupFile
    ];

    if (databaseUrl) {
        args.push(
            databaseUrl
        );
    } else {
        args.push(
            "--host",
            databaseHost,
            "--port",
            databasePort,
            "--username",
            databaseUser,
            "--dbname",
            databaseName
        );
    }

    console.log(
        "Starting PostgreSQL database backup..."
    );

    console.log(
        `Backup file: ${backupFile}`
    );

    const pgDump =
        spawn(
            "pg_dump",
            args,
            {
                stdio: [
                    "ignore",
                    "inherit",
                    "pipe"
                ],
                windowsHide: true
            }
        );

    let errorOutput = "";

    pgDump.stderr.on(
        "data",
        (chunk) => {
            errorOutput +=
                chunk.toString();
        }
    );

    pgDump.on(
        "error",
        (error) => {
            if (
                error.code ===
                "ENOENT"
            ) {
                fail(
                    "pg_dump was not found. Make sure PostgreSQL is installed and the PostgreSQL bin directory is available in PATH."
                );
                return;
            }

            fail(
                `Unable to start pg_dump: ${error.message}`
            );
        }
    );

    pgDump.on(
        "close",
        (code) => {
            if (code !== 0) {
                if (
                    fs.existsSync(
                        backupFile
                    )
                ) {
                    try {
                        fs.unlinkSync(
                            backupFile
                        );
                    } catch (error) {
                        console.error(
                            `Unable to remove incomplete backup file: ${error.message}`
                        );
                    }
                }

                fail(
                    `Database backup failed with exit code ${code}.\n${errorOutput.trim()}`
                );

                return;
            }

            if (
                !fs.existsSync(
                    backupFile
                )
            ) {
                fail(
                    "PostgreSQL reported a successful backup, but the backup file was not created."
                );

                return;
            }

            const statistics =
                fs.statSync(
                    backupFile
                );

            if (
                statistics.size === 0
            ) {
                try {
                    fs.unlinkSync(
                        backupFile
                    );
                } catch (error) {
                    console.error(
                        `Unable to remove empty backup file: ${error.message}`
                    );
                }

                fail(
                    "The database backup file is empty. The backup was not accepted."
                );

                return;
            }

            console.log(
                "Database backup completed successfully."
            );

            console.log(
                `Backup size: ${statistics.size} bytes`
            );

            console.log(
                `Saved to: ${backupFile}`
            );
        }
    );
}

runBackup();