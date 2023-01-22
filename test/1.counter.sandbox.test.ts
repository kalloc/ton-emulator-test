import {
    Address,
    Contract,
    contractAddress,
    beginCell,
    Cell,
    Dictionary,
    toNano,
    TransactionComputeVm,
    TransactionDescriptionGeneric,
    TupleBuilder,
    TupleItemCell,
    ContractProvider,
    Sender,
} from "ton";
import { Blockchain } from "@ton-community/sandbox"
import {ContractExecutor, ContractSystem, Treasure} from "ton-emulator";
import {
    CompilationTargets,
    ContractsData,
    createContract,
    getBalance,
    sha256,
} from "./helpers";
import chai, {expect} from "chai";
import BN from "bn.js";
import chaiBn from "chai-bn";
import {inspect} from "util";
import {count} from "console";

chai.use(chaiBn(BN));
import "@ton-community/test-utils" // register matchers



export class CounterContract implements Contract {
    readonly code: Cell;
    readonly address: Address;
    readonly init: { code: Cell; data: Cell; };

    constructor(workchain: number, contractCode: ContractsData) {
        const data = beginCell()
            .storeUint(0, 64)
            .endCell()
        this.init = { code: contractCode.code, data }
        this.code = contractCode.code;
        this.address = contractAddress(workchain, this.init)
    }

    async sendDeploy(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            sendMode: 1,
            value: toNano(1),
            body: beginCell().endCell()
        });
    }

    async sendIncrement(provider: ContractProvider, via: Sender, params?: Partial<{
        n: number,
        value: bigint,
    }>) {
        await provider.internal(via, {
            sendMode: 1,
            value: params?.value ?? toNano('0.05'),
            body: beginCell()
                .storeUint(params?.n ?? 10, 32)
                .endCell(),
            bounce: false,
        })
    }

    async getData(provider: ContractProvider) {
        const { stack } = await provider.get('get_total', [])
        return {
            total: stack.readNumber(),
        }
    }
}


describe('1 & 2: Counter: Sandbox', () => {

    it('should work', async () => {
        const blkch = await Blockchain.create()

        const admin = await blkch.treasury('admin')

        const contractCode = await createContract({
            "code.fc": "func/1.counter/code.fc"
        });
        const counter = blkch.openContract(new CounterContract(0, contractCode));
        await counter.sendDeploy(admin.getSender());
        const data_before = await counter.getData();
        await counter.sendIncrement(admin.getSender(), {
            n: 10
        });

        const data_after = await counter.getData();
        expect(data_after.total).to.be.equal(10);
    })
})

