import { expect} from "chai";
import Signer from "@scramble/signer-tron";
import { getTronWeb } from "@scramble/utils/src/tronweb";

/**
 * Use this wrapper for throwing async functions
 * TODO find a better place
 * @param promise
 * @param message
 */
export const expectReject = (promise, message = 'Expected reject') => promise.then(
  () => {
    throw new Error(message)
  },
  () => null
)

describe("Tron address generate", () => {
  const signer = new Signer();

  const MNEMONIC =
    "awake book subject inch gentle blur grant damage process float month clown";

  it("should generate a base58 address, T-prefixed", async () => {
    const keypair = await signer.generate(MNEMONIC, "m/44'/195'/0'/0");
    expect(keypair.address).to.contain("T").matches(/^T/);
  })

  it("should generate tron addresses correctly", async () => {
    let keypair = await signer.generate(MNEMONIC, "m/44'/195'/0'/0");
    expect(keypair.address).equals("TA8WMoiaUm8zL17icBjLAp4TofuSMBMVFm");

    keypair = await signer.generate(MNEMONIC, "m/44'/195'/0'/0/1");
    expect(keypair.address).equals("TQJodRUwdE16PVW268iSxz5WimhZ2PdZuy");

    keypair = await signer.generate(MNEMONIC, "m/44'/195'/0'/1");
    expect(keypair.address).equals("TN24aXnSh5apZUkBp8Kdkm7sodhMiBw2q3");

    expect(keypair.privateKey.length).to.be.equal(66);
    expect(keypair.publicKey.length).to.be.equal(132);
    // does not work with 0x prefixed
    const address = getTronWeb("https://api.trongrid.io").address.fromPrivateKey(keypair.privateKey.substring(2));
    expect(address).to.be.equal(keypair.address);
  });

  it('should generate the correct key pairs for tron', async () => {
    const tronSigner = new Signer();
    const mem = 'patch left empty genuine rain normal syrup yellow consider moon stock denial'
    const keypair = await tronSigner.generate(mem, "m/44'/195'/0'/0/0");

    expect(keypair.address).equals("TPiD26cc1vptLxwYmw4waHTPCNgqtZ5SCX");
    expect(keypair.publicKey).equals("0x04642b796ba0acf06233e65695b977d28d2cae90fabd70dc0a300a831866b8f46ce5ee0ffa832492ce1b55a6c90463b2a31a03729b212281f6531558145b634ee0");
    expect(keypair.privateKey).equals("0x0f9148e9be0c5b0213607a6491603891241ec7aa204918018dba691e4269ffe7");
  })

  it("should throw, if the signer path does not start wiht m/44'/195'", async () => {
    const ethreumSigner = new Signer();

    const sut = async () => ethreumSigner.generate(MNEMONIC, "m/44'/200625'/0'/0/0")

    await expectReject(sut());
  })
});