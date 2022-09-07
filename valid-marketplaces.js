import * as ethers from "ethers";
import seaportABI from "./seaport-abi.js";
export default [
  {
    name: "ens.vision",
    address: ["0xA7673aB3B0949a0EfCd818c86C71FFf7CD645ac7"],
    marketplaceAddress: "0x00000000006c3852cbef3e08e8df289169ede581",
    bulkSaleSupported: true,
    bulkPriceDiscovery: (txData, domainHash, topic) => {
      try {
        const saleLog = txData.logs.filter(
          (l) => l.topics.includes(topic.toLowerCase()) === true
        );
        const validSaleLog = saleLog.filter(
          (l) => l.data.indexOf(domainHash.substring(2).toLowerCase()) > -1
        );
        const dataDecoded = ethers.utils.defaultAbiCoder.decode(
          seaportABI,
          validSaleLog[0].data
        );
        const consideration = dataDecoded.consideration.map((c) =>
          c.amount.toString()
        );
        const offers = dataDecoded.offer.map((c) => c.amount.toString());
        console.log("VISION", consideration, offers);
        if (consideration[0] === "1") {
          return ethers.BigNumber.from(offers[0]);
        }
        return ethers.BigNumber.from(consideration[0]);
      } catch (e) {
        console.log(e);
      }
    },
  },
  {
    name: "opensea.io",
    address: [
      "0x0000a26b00c1F0DF003000390027140000fAa719",
      "0x8De9C5A032463C561423387a9648c5C7BCC5BC90",
      "0x34BA0f2379bF9B81D09f7259892e26A8b0885095",
    ],
    marketplaceAddress: "0x00000000006c3852cbef3e08e8df289169ede581",
    bulkSaleSupported: true,
    bulkPriceDiscovery: (txData, domainHash, topic) => {
      try {
        const saleLog = txData.logs.filter(
          (l) => l.topics.includes(topic.toLowerCase()) === true
        );
        const validSaleLog = saleLog.filter(
          (l) => l.data.indexOf(domainHash.substring(2).toLowerCase()) > -1
        );
        const dataDecoded = ethers.utils.defaultAbiCoder.decode(
          seaportABI,
          validSaleLog[0].data
        );
        const consideration = dataDecoded.consideration.map((c) =>
          c.amount.toString()
        );
        const offers = dataDecoded.offer.map((c) => c.amount.toString());
        console.log("OS", consideration, offers);
        if (consideration[0] === "1") {
          return ethers.BigNumber.from(offers[0]);
        }
        return ethers.BigNumber.from(consideration[0]);
      } catch (e) {
        console.log(e);
      }
    },
  },
  {
    name: "looksrare.org",
    address: ["0x59728544B08AB483533076417FbBB2fD0B17CE3a"],
    marketplaceAddress: "0x59728544B08AB483533076417FbBB2fD0B17CE3a",
    bulkSaleSupported: false,
  },
  {
    name: "x2y2.io",
    address: ["0x74312363e45dcaba76c59ec49a7aa8a65a67eed3"],
    marketplaceAddress: "0x74312363e45dcaba76c59ec49a7aa8a65a67eed3",
    bulkSaleSupported: false,
  },
];
