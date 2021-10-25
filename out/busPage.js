"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.busPage = void 0;
const getIp_1 = require("./getIp");
async function busPage(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
    });
    res.write('<h4>数据交换机</h4>');
    res.write(`<pre>
sample post:
[
    {moniker: "product", queue: 0, data: undefined},
    {moniker: "product", queue: undefined, data: {"a":1, "discription":"xxx"}}
]
</pre>`);
    res.write('<br/>');
    res.write('<div>in ip ' + getIp_1.getIp(req) +
        ' out ip ' + getIp_1.getNetIp(req) +
        ' cliet ip ' + getIp_1.getClientIp(req) + '</div><br/><br/>');
    res.end();
}
exports.busPage = busPage;
//# sourceMappingURL=busPage.js.map