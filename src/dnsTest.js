import dns from "dns/promises";

try {
    const result = await dns.resolveSrv(
        "_mongodb._tcp.testing.rdqvgba.mongodb.net"
    );

    console.log(result);
} catch (error) {
    console.error("DNS ERROR:", error);
}