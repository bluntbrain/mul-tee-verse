Commands to build app
docker buildx build --platform=linux/amd64 -t lbadlani/js-engine-tee:app-v1 --push .


Commands to verify attestation quote
xxd -r -p quote.hex quote.bin
dcap-qvl verify quote.bin
