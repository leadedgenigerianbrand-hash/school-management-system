"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

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

const argumentsList =
    process.argv.slice(2);

const confirmationIndex =
    argumentsList.indexOf(
        "--confirm-restore"
    );

const backupArguments =
    argumentsList.filter(
        (argument) =>
            argument !==
            "--confirm-restore"
    );

function fail(message) {
    console.error(message);
    process.exitCode = 1;
}

function printUsage() {
    console.log(
        "Usage: node scripts/restore.js <backup-file> --confirm-restore"
    );
}

function getBackupFile() {
    if (
        backupArguments.length !==
        1
    ) {
        return null;
    }

    return path.resolve(
        process.cwd(),
        backupArguments[0]
    );
}

function buildDatabaseArguments() {
    if (databaseUrl) {
        return [
            databaseUrl
        ];
    }

    return [
        "--host",
        databaseHost,
        "--port",
        databasePort,
        "--username",
        databaseUser,
        "--dbname",
        databaseName
    ];
}

function runRestore() {
    if (
        confirmationIndex === -1
    ) {
        fail(
            "Restore was not started because --confirm-restore was not provided."
        );

        printUsage();

        return;
    }

    const backupFile =
        getBackupFile();

    if (!backupFile) {
        fail(
            "A single PostgreSQL backup file must be provided."
        );

        printUsage();

        return;
    }

    if (
        !fs.existsSync(
            backupFile
        )
    ) {
        fail(
            `Backup file was not found: ${backupFile}`
        );

        return;
    }

    const statistics =
        fs.statSync(
            backupFile
        );

    if (
        !statistics.isFile()
    ) {
        fail(
            `The specified backup path is not a file: ${backupFile}`
        );

        return;
    }

    if (
        statistics.size === 0
    ) {
        fail(
            `The specified backup file is empty: ${backupFile}`
        );

        return;
    }

    const databaseArguments =
        buildDatabaseArguments();

    const restoreArguments = [
        "--clean",
        "--if-exists",
        "--exit-on-error",
        ...databaseArguments,
        backupFile
    ];

    console.log(
        "PostgreSQL database restore requested."
    );

    console.log(
        `Backup file: ${backupFile}`
    );

    console.log(
        `Target database: ${databaseName}`
    );

    console.log(
        "Existing database objects affected by the backup may be replaced."
    );

    const pgRestore =
        spawn(
            "pg_restore",
            restoreArguments,
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

    pgRestore.stderr.on(
        "data",
        (chunk) => {
            errorOutput +=
                chunk.toString();
        }
    );

    pgRestore.on(
        "error",
        (error) => {
            if (
                error.code ===
                "ENOENT"
            ) {
                fail(
                    "pg_restore was not found. Make sure PostgreSQL is installed and the PostgreSQL bin directory is available in PATH."
                );

                return;
            }

            fail(
                `Unable to start pg_restore: ${error.message}`
            );
        }
    );

    pgRestore.on(
        "close",
        (code) => {
            if (
                code !== 0
            ) {
                fail(
                    `Database restore failed with exit code ${code}.\n${errorOutput.trim()}`
                );

                return;
            }

            console.log(
                "Database restore completed successfully."
            );

            if (
                errorOutput.trim()
            ) {
                console.log(
                    "PostgreSQL messages:"
                );

                console.log(
                    errorOutput.trim()
                );
            }
        }
    );
}

runRestore();