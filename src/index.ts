import bodyParser = require("body-parser");
import express, { response } from "express";
import helmet = require("helmet");

import { deleteLink, getLink, isValidBody, setLink } from "./redisHandler";

// tslint:disable:no-console

const app = express();
const port = 8080; // default port to listen

app.use(helmet(), bodyParser.json());

app.get("/link/?*", async ( req, res ) => {
    // strip first set of slashes
    const scope = req.originalUrl.replace("/link/", "").split("/");
    let id = scope.pop();

    // kill of random trailing slashes
    while (id === "" && scope.length > 0) {
        id = scope.pop();
    }

    console.log(`Retrieving ${id} at scope ${scope}`);

    try {

        const link = await getLink(scope, id);

        if (link === null) {
            res.sendStatus(404);
        } else {
            res.send(JSON.stringify(link));
        }
    } catch (err) {
        res.send(500);
        res.send(`Received an error while getting link: ${err.message}`);
    }
} );

app.post("/link/?", async ( req, res ) => {
    if (isValidBody(req.body)) {
        try {
            const link = await setLink(req.body.scope.split(":"), req.body.id, req.body.url);
            res.status(201);
            res.send(link);
        } catch (err) {
            res.status(500);
            res.send(`Received an error while creating a new link: ${err.message}`);
        }
    } else {
        res.status(400);
        res.send( "A valid body must have both a non-null string for id and a possibly empty string for scope.");
    }
} );

app.delete("/link/?*", async ( req, res ) => {
    // strip first set of slashes
    const scope = req.originalUrl.replace("/link/", "").split("/");
    let id = scope.pop();

    // kill of random trailing slashes
    while (id === "" && scope.length > 0) {
        id = scope.pop();
    }

    try {
        const isDeleted = await deleteLink(scope, id);

        if (isDeleted) {
            res.sendStatus(204);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        res.status(500);
        res.send(`Received an error while deleting link: ${err.message}`);
    }
} );

// start the Express server
app.listen( port, () => {

    console.log( `server started at http://localhost:${ port }` );
} );
