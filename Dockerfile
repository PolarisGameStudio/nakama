# =========================
# Stage 1: Build Nakama
# =========================
FROM golang:1.25-alpine AS builder

ENV GO111MODULE=on \
    CGO_ENABLED=0

RUN apk add --no-cache git make

WORKDIR /go/src/github.com/heroiclabs/nakama

COPY . .

# Build Nakama binary
RUN go build -trimpath -ldflags "-s -w" -o nakama .

# =========================
# Stage 2: Runtime image
# =========================
FROM alpine:3.19

RUN apk add --no-cache ca-certificates

# Create Nakama directory structure
RUN mkdir -p /nakama/config /nakama/data /nakama/logs

# Copy Nakama binary from builder
COPY --from=builder /go/src/github.com/heroiclabs/nakama/nakama /nakama/nakama

# Create a non-root user
RUN addgroup -S nakama && adduser -S nakama -G nakama \
    && chown -R nakama:nakama /nakama

USER nakama

WORKDIR /nakama

# Expose Nakama ports
EXPOSE 7349 7350 7351

# Default entrypoint and command
ENTRYPOINT ["/nakama/nakama"]
CMD ["--name", "nakama", "--logger.level", "info"]
