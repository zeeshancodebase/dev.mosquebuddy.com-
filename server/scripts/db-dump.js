import prisma from "../src/config/prisma.js";

async function main() {
    console.log("COUNTRIES");
    console.log(await prisma.country.findMany());

    console.log("\nSTATES");
    console.log(await prisma.state.findMany());

    console.log("\nCITIES");
    console.log(await prisma.city.findMany());

    console.log("\nAREAS");
    console.log(await prisma.area.findMany());

    console.log("\nVENUES");
    console.log(
        await prisma.venue.findMany({
            select: {
                id: true,
                name: true,
            },
        })
    );
    console.log(
        await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
            },
        })
    );
    console.log(await prisma.dailyPrayerTiming.count());
    console.log(await prisma.jumuahTiming.count());
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });