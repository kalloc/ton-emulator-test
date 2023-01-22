import {
    Address,
    beginCell,
    Cell,
    Dictionary,
    toNano,
    TransactionComputeVm,
    TransactionDescriptionGeneric,
    TupleBuilder,
    TupleItemCell,
} from "ton";
import {ContractExecutor, ContractSystem, Treasure} from "ton-emulator";
import {
    CompilationTargets,
    createContract,
    getBalance,
    sha256,
} from "./helpers";
import chai, {expect} from "chai";
import BN from "bn.js";
import chaiBn from "chai-bn";
import {inspect} from "util";

chai.use(chaiBn(BN));


const deploy = async (
    system: ContractSystem,
    owner: Treasure
): Promise<ContractExecutor> => {
    const contractCode = await createContract({
        "code.fc": "func/1.counter/code.fc"
    });

    const data = beginCell()
        .storeUint(0, 64)
        .endCell();

    const contract = await ContractExecutor.create(
        {
            code: contractCode.code,
            data,
            balance: BigInt(10)
        },
        system
    );

    await owner.send({
        sendMode: 1,
        to: contract.address,
        value: toNano(10),
        init: {
            code: contractCode.code,
            data
        },
        body: beginCell().endCell(),
        bounce: false,
    });
    await system.run();

    return contract;
};

describe("1 & 2: Counter: Ton Emulator", () => {
    let system: ContractSystem;
    let owner: Treasure;
    let counter: ContractExecutor;

    before(async () => {
        system = await ContractSystem.create();
        owner = system.treasure("random-owner");
        counter = await deploy(system, owner);
    });

    it("get_unknown_method", async () => {
        const result = await counter.get("get_total_unknown");
        expect(result.success).to.be.true;
    });

    it("get_total", async () => {
        const result = await counter.get("get_total");
        expect(result.success).to.be.true;
        if(result.success) {
            let total = result.stack.readNumber();
            expect(total).to.be.eq(0);
        }
    });

    it("send n", async () => {
        const message = beginCell()
            .storeUint(10, 32)
            .endCell();
        const value = toNano('0.05');

        let tracker = system.track(counter.address);

        await owner.send({
            sendMode: 1,
            to: counter.address,
            value: value,
            body: message,
            bounce: false,
        });

        let txs = await system.run();
        let tx = txs[txs.length - 1];
        // console.log(inspect(tracker.events()[0]));

        console.warn(inspect(tx, false, 10000));
        expect(tx.inMessage!.body!.toString()).to.be.eq(message.toString());

        expect(tx.description.type).to.be.eq('generic');
        expect((tx.description as TransactionDescriptionGeneric).aborted).to.be.false;

        const result = await counter.get("get_total");
        expect(result.success).to.be.true;

        if(result.success) {
            let total = result.stack.readNumber();
            // failed there
            expect(total).to.be.eq(10);
        }
    });
});
