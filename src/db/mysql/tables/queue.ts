import { Table } from '../tool';

const moniker: Table = {
    name: 'moniker',
    code: [
        "`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
        "moniker varchar(200)",
        "`in` tinyint default 0",
        "`out` tinyint default 0",
        "UNIQUE INDEX moniker_id(`moniker`, `id`)",
    ],
}

const queueIn: Table = {
    name: 'queue_in',
    code: [
        "`id` BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY",
        "`moniker` INT NOT NULL",
        "`body` TEXT NOT NULL",
        "date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    ]
};

const queueInFailed: Table = {
    name: 'queue_in_failed',
    code: [
        "`id` BIGINT(20) NOT NULL PRIMARY KEY",
        "`reason` TEXT",
        "date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP",
    ]
};

const queueOut: Table = {
    name: 'queue_out',
    code: [
        "`id` BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY",
        "`moniker` INT NOT NULL",
        "`body` TEXT NOT NULL",
        "date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    ]
};

const queueP: Table = {
    name: 'queue_p',
    code: [
        "moniker INT NOT NULL",
        "queue_in BIGINT NOT NULL DEFAULT 0",
        "queue_out BIGINT NOT NULL DEFAULT 0",
        "PRIMARY KEY(moniker)"
    ]
};

const notify: Table = {
    name: 'notify',
    code: [
        "moniker INT NOT NULL",
        "notifiedAt TIMESTAMP NOT NULL",
        "PRIMARY KEY(moniker)"
    ]
}

export default [
    moniker, queueIn, queueInFailed, queueOut, queueP, notify
];
