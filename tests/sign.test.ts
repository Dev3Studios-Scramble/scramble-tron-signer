import { bufferToHex, hexToBuffer } from "@scramble/utils";
import { expect } from "chai";
import { privateToPublic } from "ethereumjs-util";
import Signer from "@scramble/signer-tron";

describe("Tron signing", () => {
  const echash =
    "82ff40c0a986c6a5cfad4ddf4c3aa6996f1a7837f9c398e17e5de5cbd5a12b28";
  const ecprivkey =
    "3c9229289a6125f7fdf1885a77bb12c37a8d3b4962d936f7e3084dece32a3ca1";
  const ecpair = {
    publicKey: bufferToHex(privateToPublic(hexToBuffer(ecprivkey))),
    privateKey: ecprivkey,
  };
  it("it should sign correctly", async () => {
    const tronSigner = new Signer();
    const signature = await tronSigner.sign(echash, ecpair);
    expect(signature).equals(
      "0x92b817b813cc8b71bf929097d63326e39e686b9216b8658b31c4c782ef219534614cc137aacc0d427a2e9227edcc0e1018a156803918e7eb103ea77b54229d5b1b"
    );
  });
});
