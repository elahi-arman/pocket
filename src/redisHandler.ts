import redis, { RedisError } from "redis";
import { promisify } from "util";

interface ILink {
  scope: string;
  id: string;
  url: string;
  dateModified: number;
  dateCreated: number;
  visits: number;
  lastVisited: number;
  error?: string;
}

type ResolvedGet = ILink | null;
type ResolvedSet = string | RedisError;

const client = redis.createClient();
const redisGet = promisify(client.get).bind(client);
const redisSet = promisify(client.set).bind(client);
const redisDelete = promisify(client.del).bind(client);

export async function getLink(scope: string[], id: string): Promise<ResolvedGet> {

  let returnedLink: ILink;
  // parallel array of scopes and promises
  const scopes: string[] = [];
  const promises: Array<Promise<string>> = [];

  for (let i = scope.length; i > 0; i--) {
    const partialScope = scope.slice(0, i).join(":");
    const key = `${partialScope}:${id}`;

    scopes.push(partialScope);
    promises.push(redisGet(key));
  }

  promises.push(redisGet(id));
  scopes.push(id);

  // links will be in reverse order so the most scoped will be first
  const links = await Promise.all(promises);
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    if (link !== null) {
      try {
        returnedLink = JSON.parse(link);
      } catch (err) {
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

      return {
        id,
        scope: scopes[i] === id ? "" : scopes[i],
        url: link,
        ...returnedLink,
      };
    }
  }

  return null;
}

export async function setLink(scope: string[], id: string, url: string): Promise<ResolvedSet> {
  const now = new Date().getTime();

  const metadata = JSON.stringify({
    url,
    dateModified: now,
    dateCreated: now,
    visits: 0,
    lastVisited: now,
  });

  const key = scope.length === 1 && scope[0] === "" ? id : `${scope.join(":")}:${id}`;

  await redisSet(key, metadata);
  return key;
}

export async function deleteLink(scope: string[], id: string): Promise<number> {
  const key = scope.length === 0 ? id : `${scope.join(":")}:${id}`;
  return redisDelete(key);
}

export function isValidBody(body: any): body is ILink {
  const assumedBody = body as ILink;
  return typeof assumedBody.scope === "string"
    && typeof assumedBody.id === "string"
    && !!assumedBody.id
    && typeof assumedBody.url === "string";
}
