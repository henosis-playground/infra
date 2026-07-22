FROM busybox:1.37.0-musl AS busybox

FROM postgrest/postgrest:v14.12
COPY --from=busybox /bin/busybox /bin/busybox
