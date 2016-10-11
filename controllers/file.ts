import { DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller } from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";
import * as fs from "fs";
import * as path from "path";
import Util from "../util";

@Controller("/")
@DocController("File Controller.")
export default class File {

    @Get("/:fileName")
    index(context: Context, @K.FromPath("fileName") fileName: string): void {
        if (Util.isEmpty(fileName)) {
            throw new K.NotFound("Invalid file name");
        }

        fileName = fileName.trim();

        if (fileName.startsWith(".") || (fileName.indexOf("/") >= 0)) {
            throw new K.BadRequest("Invalid file name");
        }

        let fullPath = path.join(process.env.content_dir, fileName);

        if (!fs.existsSync(fullPath)) {
            throw new K.NotFound("File not found");
        }

        let content = fs.readFileSync(fullPath);

        context.response.status(200).send(content);
    }
}