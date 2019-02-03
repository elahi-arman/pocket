"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const express_1 = __importDefault(require("express"));
const helmet = require("helmet");
const redisHandler_1 = require("./redisHandler");
// tslint:disable:no-console
const app = express_1.default();
const port = 8080; // default port to listen
app.use(helmet(), bodyParser.json());
app.get("/link/?*", (req, res) => __awaiter(this, void 0, void 0, function* () {
    // strip first set of slashes
    const scope = req.originalUrl.replace("/link/", "").split("/");
    let id = scope.pop();
    // kill of random trailing slashes
    while (id === "" && scope.length > 0) {
        id = scope.pop();
    }
    console.log(`Retrieving ${id} at scope ${scope}`);
    try {
        const link = yield redisHandler_1.getLink(scope, id);
        if (link === null) {
            res.sendStatus(404);
        }
        else {
            res.send(JSON.stringify(link));
        }
    }
    catch (err) {
        res.send(500);
        res.send(`Received an error while getting link: ${err.message}`);
    }
}));
app.post("/link/?", (req, res) => __awaiter(this, void 0, void 0, function* () {
    if (redisHandler_1.isValidBody(req.body)) {
        try {
            const link = yield redisHandler_1.setLink(req.body.scope.split(":"), req.body.id, req.body.url);
            res.status(201);
            res.send(link);
        }
        catch (err) {
            res.status(500);
            res.send(`Received an error while creating a new link: ${err.message}`);
        }
    }
    else {
        res.status(400);
        res.send("A valid body must have both a non-null string for id and a possibly empty string for scope.");
    }
}));
app.delete("/link/?*", (req, res) => __awaiter(this, void 0, void 0, function* () {
    // strip first set of slashes
    const scope = req.originalUrl.replace("/link/", "").split("/");
    let id = scope.pop();
    // kill of random trailing slashes
    while (id === "" && scope.length > 0) {
        id = scope.pop();
    }
    try {
        const isDeleted = yield redisHandler_1.deleteLink(scope, id);
        if (isDeleted) {
            res.sendStatus(204);
        }
        else {
            res.sendStatus(404);
        }
    }
    catch (err) {
        res.status(500);
        res.send(`Received an error while deleting link: ${err.message}`);
    }
}));
// start the Express server
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map