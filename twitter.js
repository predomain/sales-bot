import { TwitterApi } from "twitter-api-v2";
import twitterConfig from "./twitter-conf.js";
import template from "./tweet-template.js";
import converter from "svg-to-img";
import * as fs from "fs";

const twitterClient = new TwitterApi(twitterConfig);
export default async (keysValues) => {
  const avatarTemplate = fs.readFileSync("./cashtag.svg");
  const avatarTemplateFinal = avatarTemplate
    .toString()
    .replace("$cashtag", keysValues.DOMAIN);
  const png = await converter.from(avatarTemplateFinal).toPng();
  fs.writeFileSync("./avatars/" + keysValues.DOMAINHASH + ".png", png);
  const path = "./avatars/" + keysValues.DOMAINHASH + ".png";
  const mediaId = await twitterClient.v1.uploadMedia(path);
  const tKeys = Object.keys(keysValues);
  let tweetParsed = template;
  for (const k of tKeys) {
    tweetParsed = tweetParsed.split("{{" + k + "}}").join(keysValues[k]);
  }
  twitterClient.v1
    .tweet(tweetParsed, { media_ids: mediaId })
    .then((r) => {
      console.log("Tweet succeeded!");
    })
    .catch((e) => {
      console.log("ERROR tweeting:", e);
    });
};
