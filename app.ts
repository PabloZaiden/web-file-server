import * as Express from "express";
import * as CookieParser from "cookie-parser";
import * as BodyParser from "body-parser";
import * as Http from "http";
import * as K from "kwyjibo";

import * as Passport from "passport";
import * as PassportLocal from "passport-local";
import cookieSession = require("cookie-session");

export default class App {

    private static port: number = App.normalizePort(process.env.port || "3000");
    private static server: Http.Server;
    private static express: Express.Express;
    private static isDevelopment = false;

    private static securityProvider: SecurityProvider;

    public static get authorize(): Express.Handler {
        return App.securityProvider.getAuthorizeMiddleware();
    }

    public static get authenticate(): Express.Handler {
        return App.securityProvider.getAuthenticateMiddleware();
    }


    public static init(): void {
        if (process.env.NODE_ENV === "development") {
            App.isDevelopment = true;
        }

        App.express = Express();

        App.express.set("view engine", "hbs");

        var hbs = require("hbs");
        hbs.registerPartials(__dirname + "/views/partials");

        App.express.set("trust proxy", true);
        App.express.use(BodyParser.json());
        App.express.use(BodyParser.urlencoded({ extended: false }));
        App.express.use(CookieParser());

        // verify env data
        App.verifyEnvData([
            "session_secret",
            "admin_user",
            "admin_password",
            "content_dir"]);

        App.express.use(cookieSession({
            secret: process.env.session_secret,
            name: "session"
        }));

        App.express.use(Passport.initialize());
        App.express.use(Passport.session());

        Passport.use(new PassportLocal.Strategy((user, pass, done) => {
            if (process.env.admin_user && process.env.admin_password) {
                if (process.env.admin_user === user && process.env.admin_password === pass) {
                    done(null, { username: user });
                } else {
                    done(new Error("Invalid user/pass"), null);
                }
            } else {
                done(null, { username: user });
            }
        }));

        Passport.serializeUser((user, done) => {
            done(null, user);
        });

        Passport.deserializeUser((user, done) => {
            done(null, user);
        });

        App.securityProvider = {
            getAuthorizeMiddleware(): Express.Handler {
                return (req, res, next) => {
                    if (!req.isAuthenticated()) {
                        res.redirect("/auth/authenticate");
                    } else {
                        next();
                    }
                };
            },

            getAuthenticateMiddleware(): Express.Handler {
                return Passport.authenticate("local");
            }
        }

    }

    public static start(): void {

        // Create HTTP server.
        App.server = Http.createServer(App.express);

        App.express.use(Express.static("public"));

        App.express.use((req, res, next) => {
            if (req.url.toLowerCase().endsWith(".pdf")) {
                res.header("Content-Type", "application/force-download");
            }

            next();
        });

        // Init all Kwyjibo controllers, tests, loggers and error handlers
        K.initialize(App.express);

        if (!App.isDevelopment) {
            K.addErrorHandler((error: any, req: Express.Request, res: Express.Response, next: Function) => {
                console.error(error);

                // shhh... these are not the doids you are looking for. Move along.
                res.redirect("/");
            });
        }

        // Add static files

        // Listen on provided port, on all network interfaces.
        App.express.set("port", App.port);
        App.server.listen(App.port);
        App.server.on("error", App.onError);
        App.server.on("listening", App.onListening);
    }

    private static normalizePort(val: string): any {
        let port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    private static onError(error: any): void {

        if (error.syscall !== "listen") {
            throw error;
        }

        let bind = typeof App.port === "string" ? ("Pipe " + App.port) : ("Port " + App.port);

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case "EACCES":
                console.error(bind + " requires elevated privileges");
                process.exit(1);
                break;
            case "EADDRINUSE":
                console.error(bind + " is already in use");
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    private static onListening(): void {
        let addr = App.server.address();
        let bind = typeof addr === "string" ?
            "pipe " + addr :
            "port " + addr.port;

        if (App.isDevelopment) {
            console.log("Listening on " + bind);
        }
    }

    private static verifyEnvData(properties: string[]): void {
        for (let prop of properties) {
            if (!process.env[prop]) {
                throw new Error(`Missing ENV var: ${prop}`);
            }
        }
    }
}


interface SecurityProvider {
    getAuthorizeMiddleware(): Express.Handler;
    getAuthenticateMiddleware(): Express.Handler;
}

App.init();
App.start();
