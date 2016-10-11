import { DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller } from "kwyjibo";
import * as K from "kwyjibo";
import App from "../app";
import * as fs from "fs";
import * as path from "path";
import Util from "../util";
import File from "./file";


@Controller("/admin")
@DocController("Admin Controller.")
export default class Admin {

    @Get("/")
    @ActionMiddleware(App.authorize)
    @DocAction(`Index`)
    index(context: Context): void {
        context.response.redirect(K.getActionRoute(Admin, "filesGET"));
    }

    @Get("/files")
    @ActionMiddleware(App.authorize)
    filesGET(context: Context): K.Renderable {
        let dirContent = fs.readdirSync(process.env.content_dir);

        let files: string[] = [];

        for (let file of dirContent) {
            if (!file.startsWith(".")) {
                files.push(file);
            }
        }

        let model = {
            links: {
                file: K.getActionRoute(File, "index").replace(":fileName", ""),
                deleteFile: K.getActionRoute(Admin, "delete")
            },
            files: files,
            $render_view: "file_list"
        }

        return model;
    }

    @Post("/files")
    @ActionMiddleware(App.authorize)
    @ActionMiddleware(require("express-fileupload")())
    filesPOST(context: Context, @K.FromBody() body: any): void {
        let files = context.request["files"];
        let fileName: string = body.fileName;

        if (files && !Util.isEmpty(body.fileName)) {
            if (files.newFile.data.length > 0) {
                let content = new Buffer(files.newFile.data);
                fileName = fileName.trim();

                if (!fileName.startsWith(".") && !(fileName.indexOf("/") >= 0)) {
                    let fullPath = path.join(process.env.content_dir, fileName);
                    fs.writeFileSync(fullPath, content);
                }
            }
        }

        context.response.redirect(K.getActionRoute(Admin, "filesGET"));
    }

    @Post("/delete")
    @ActionMiddleware(App.authorize)
    delete(context: Context, @K.FromBody() body: any): void {
        let fileName: string = body.fileName;

        if (!Util.isEmpty(body.fileName)) {
            fileName = fileName.trim();

            if (!fileName.startsWith(".") && !(fileName.indexOf("/") >= 0)) {
                let fullPath = path.join(process.env.content_dir, fileName);
                fs.unlinkSync(fullPath);
            }

        }

        context.response.redirect(K.getActionRoute(Admin, "filesGET"));
    }
}