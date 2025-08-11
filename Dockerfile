FROM denoland/deno:2.3.1
ENV TZ=UTC
ENV PORT=8370
EXPOSE 8370

WORKDIR /app

COPY api/ ./api/
COPY relay/ ./relay/
COPY .npmrc .
COPY deno-docker.json ./deno.json

RUN chown -R deno:deno /app/

USER deno

RUN deno install --allow-scripts

CMD ["sh", "-c", "deno run --allow-all ./api/.tasks/migrate.ts && deno run --allow-all ./api/server.ts"]