import {DocController, DocAction, Get, Post, Context, ActionMiddleware, Controller} from "kwyjibo";
import Admin from "./admin";
import * as K from "kwyjibo";
import App from "../app";

@Controller("/auth")
@DocController("Auth Controller.")
class Auth {

    @Get("/authenticate")
    login(context: Context): void {
        context.response.render("login");
    }
 
    @Post("/authenticate")
    @DocAction(`Action that triggers the authentication middleware`)
    @ActionMiddleware(App.authenticate)
    goToAuthentication(context: Context): void {
        // once you get here, the user will be successfully authenticated
        context.response.redirect(K.getActionRoute(Admin, "index"));
    }    
}