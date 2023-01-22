

# Ton-emulator & Sandbox test example 

```bash
$ ts-mocha './test/*.test.ts'


  1 & 2: Counter: Sandbox
    ✔ should work (1281ms)

  1 & 2: Counter: Ton Emulator
    ✔ get_unknown_method
    ✔ get_total
    1) send n


  3 passing (2s)
  1 failing

  1) 1 & 2: Counter: Ton Emulator
       send n:

      AssertionError: expected +0 to equal 10
      + expected - actual

      -0
      +10
      
      at Context.<anonymous> (test/1.counter.ton-emulator.test.ts:121:33)

```
