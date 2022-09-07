import * as ethers from "ethers";
import Sale from "./sale.js";
import getDomain from "./getdomain.js";
import tweet from "./twitter.js";
import patternChecks from "./pattern-checks.conf.js";
import validMarketplaces from "./valid-marketplaces.js";
import contractsToTrack from "./contracts-to-track.js";
import infuraConf from "./infura-conf.js";

const validPatterns = Object.keys(patternChecks);
if (
  process.argv.length < 3 ||
  validPatterns.includes(process.argv[2]) === false
) {
  console.log(
    "Patter is not valid. See the list of valid patterns:",
    validPatterns
  );
}
if (process.argv.length < 4 || isNaN(process.argv[3]) === true) {
  console.log("Min price not valid.");
}
const patternToTrackSelection = process.argv[2];
const minPriceToTweet = process.argv[3];
const patternToTrack = patternChecks[patternToTrackSelection];
const ENSRegistrarAddress = "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85";
const ENSTransferTopicIndicator =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const provider = new ethers.providers.InfuraProvider("homestead", infuraConf);

const soldList = [];
for (const c of contractsToTrack) {
  const filter = {
    address: [c.address],
    topics: [c.filterTopic],
  };
  provider.on(filter, (e) => {
    if (
      e.data.indexOf(ENSRegistrarAddress.substring(2)) > -1 &&
      e.address.toLowerCase() === c.address.toLowerCase()
    ) {
      let txData;
      provider
        .getTransactionReceipt(e.transactionHash)
        .then((r) => {
          return provider.getTransaction(e.transactionHash).then((tx) => {
            return { ...r, tx };
          });
        })
        .then((r) => {
          txData = r;
          const validLog = r.logs
            .filter(
              (d) =>
                d.address.toLowerCase() === ENSRegistrarAddress.toLowerCase()
            )
            .map((d) => {
              if (
                d.topics[0].toLowerCase() ===
                ENSTransferTopicIndicator.toLowerCase()
              ) {
                const domainId = ethers.BigNumber.from(d.topics[3]).toString();
                return domainId;
              }
              return null;
            });
          return validLog;
        })
        .then((r) => {
          if (r === null) {
            throw "Domain ID resolution failed.";
          }
          return Promise.all(
            r.map(async (d) => {
              const domain = await getDomain(d).catch((e) => null);
              return domain;
            })
          );
        })
        .then((r) => {
          try {
            const patternChecker = new RegExp(patternToTrack);
            if (r[0] === null) {
              throw "Domain metadata resolution failed.";
            }
            const domainName = r[0].registrations[0].labelName;
            const domainHash = r[0].registrations[0].domain.labelhash;
            const isBulkSale =
              txData.logs.filter((l) => {
                return (
                  l.topics.includes(ENSTransferTopicIndicator.toLowerCase()) ===
                  true
                );
              }).length > 1;
            const marketplaceData = validMarketplaces.filter((m) => {
              let foundMarketPlaceBeneficiary = false;
              for (const addr of m.address) {
                if (
                  txData.tx.data.indexOf(addr.substring(2).toLowerCase()) > -1
                ) {
                  foundMarketPlaceBeneficiary = true;
                }
              }
              return (
                (isBulkSale === false ||
                  (isBulkSale === true && m.bulkSaleSupported === true)) &&
                m.marketplaceAddress.toLowerCase() ===
                  c.address.toLowerCase() &&
                foundMarketPlaceBeneficiary === true
              );
            });
            if (marketplaceData.length <= 0) {
              throw "Marketplace not supported.";
            }
            let price = txData.tx.value;
            if (isBulkSale === true) {
              switch (marketplaceData[0].name) {
                case "opensea.io":
                case "ens.vision":
                  {
                    price = marketplaceData[0].bulkPriceDiscovery(
                      txData,
                      domainHash,
                      c.filterTopic
                    );
                    console.log(
                      "Price log in bulk sale for",
                      domainName,
                      ":",
                      ethers.utils.formatEther(price)
                    );
                  }
                  break;
              }
            }
            const marketplaceName = marketplaceData[0].name;
            if (
              domainName !== domainName.toLowerCase() ||
              domainName === undefined ||
              (patternToTrackSelection !== "ANY" &&
                domainName !== undefined &&
                patternChecker.test(domainName) === false) ||
              soldList.includes(domainHash) === true
            ) {
              throw "Domain is corrupt, invalid or duplicate.";
            }
            const finalPrice = ethers.utils.formatEther(price);
            if (parseFloat(finalPrice) < parseFloat(minPriceToTweet)) {
              throw "Domain price not enough: " + finalPrice;
            }
            soldList.push(domainHash);
            const saleValue = finalPrice;
            const newSale = new Sale();
            newSale.marketplace = marketplaceName;
            newSale.price = saleValue;
            newSale.domain = domainName + ".eth";
            newSale.hash = ethers.BigNumber.from(domainHash).toString();
            return newSale;
          } catch (e) {
            throw e;
          }
        })
        .then((r) => {
          console.log(r.domain, "sold for", r.price, "ETH at", r.marketplace);
          tweet({
            DOMAIN: r.domain,
            PRICE: r.price,
            MARKETPLACE: r.marketplace,
            DOMAINHASH: r.hash,
          });
        })
        .catch((e) => {
          console.log(e);
        });
    }
  });
}
