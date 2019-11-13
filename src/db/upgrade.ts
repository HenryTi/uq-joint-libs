import {upgrade} from './mysql/upgradeDb';

upgrade().then(v => {
    console.log('Database upgrade finished.');
    process.exit();
});
