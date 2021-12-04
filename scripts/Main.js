const { DeFiFork } = require("./DefiScript.js");

async function main(){
    DeFiFork();
}

// using this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});