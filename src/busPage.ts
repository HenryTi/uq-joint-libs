import { Request, Response } from "express";
import { getIp, getNetIp, getClientIp } from "./getIp";

export async function busPage(req: Request, res: Response) {
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
    });
    res.write('<h4>数据交换机</h4>');
    res.write(
`<pre>
sample post:
[
    {moniker: "product", queue: 0, data: undefined},
    {moniker: "product", queue: undefined, data: {"a":1, "discription":"xxx"}}
]
</pre>`);

    res.write('<br/>');
    res.write('<div>in ip ' + getIp(req) + 
        ' out ip ' + getNetIp(req) + 
        ' cliet ip ' + getClientIp(req) + '</div><br/><br/>');

    res.end();
}

