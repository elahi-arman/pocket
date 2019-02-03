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
const redis_1 = __importDefault(require("redis"));
const util_1 = require("util");
const client = redis_1.default.createClient();
const redisGet = util_1.promisify(client.get).bind(client);
const redisSet = util_1.promisify(client.set).bind(client);
const redisDelete = util_1.promisify(client.del).bind(client);
function getLink(scope, id) {
    return __awaiter(this, void 0, void 0, function* () {
        let returnedLink;
        // parallel array of scopes and promises
        const scopes = [];
        const promises = [];
        for (let i = scope.length; i > 0; i--) {
            const partialScope = scope.slice(0, i).join(":");
            const key = `${partialScope}:${id}`;
            scopes.push(partialScope);
            promises.push(redisGet(key));
        }
        promises.push(redisGet(id));
        scopes.push(id);
        // links will be in reverse order so the most scoped will be first
        const links = yield Promise.all(promises);
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            if (link !== null) {
                try {
                    returnedLink = JSON.parse(link);
                }
                catch (err) {
                    console.error(`link with key ${scope}:${id} returned malformed JSON`);
                    returnedLink = {
                        id,
                        scope: scopes[i] === id ? "" : scopes[i],
                        url: "Unknown",
                        dateModified: 0,
                        dateCreated: 0,
                        visits: 0,
                        lastVisited: 0,
                        error: `This entry has been corrupted, delete and re-create it. Original JSON = ${link}`
                    };
                }
                return Object.assign({ id, scope: scopes[i] === id ? "" : scopes[i], url: link }, returnedLink);
            }
        }
        return null;
    });
}
exports.getLink = getLink;
function setLink(scope, id, url) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date().getTime();
        const metadata = JSON.stringify({
            url,
            dateModified: now,
            dateCreated: now,
            visits: 0,
            lastVisited: now,
        });
        const key = scope.length === 1 && scope[0] === "" ? id : `${scope.join(":")}:${id}`;
        yield redisSet(key, metadata);
        return key;
    });
}
exports.setLink = setLink;
function deleteLink(scope, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = scope.length === 0 ? id : `${scope.join(":")}:${id}`;
        return redisDelete(key);
    });
}
exports.deleteLink = deleteLink;
function isValidBody(body) {
    const assumedBody = body;
    return typeof assumedBody.scope === "string"
        && typeof assumedBody.id === "string"
        && !!assumedBody.id
        && typeof assumedBody.url === "string";
}
exports.isValidBody = isValidBody;
//# sourceMappingURL=redisHandler.js.map