import * as ethers from "ethers";
import { request, gql } from "graphql-request";

const url = "https://api.thegraph.com/subgraphs/name/ensdomains/ens";
export default (domain) => {
  try {
    const query = gql`
      query ($domainId: String!) {
        registrations(first: 1, where: { id: $domainId }) {
          id
          labelName
          expiryDate
          registrationDate
          registrant {
            id
          }
          domain {
            id
            createdAt
            labelhash
          }
        }
      }
    `;
    return request(url, query, {
      domainId: ethers.BigNumber.from(domain).toHexString(),
    });
  } catch (e) {
    console.log("ERROR Subgraph:", e);
  }
};
