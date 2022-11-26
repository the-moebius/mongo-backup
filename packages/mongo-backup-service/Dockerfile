
# Using multistage build to produce minimal size application image

#==================#
# BUILD BASE IMAGE #
#==================#

FROM node:18-alpine AS build-base

# Updating npm to the latest version
RUN npm install -g npm


#=============#
# BUILD IMAGE #
#=============#

FROM build-base AS build

WORKDIR /tmp/build

COPY              \
  ./src           \
  ./tsconfig.json \
  ./package.json  \
  ./

# Installing all dependencies for building
RUN npm install --no-fund --no-audit --no-package-lock

RUN npm run build


#===============#
# INSTALL IMAGE #
#===============#

FROM build-base AS install

WORKDIR /tmp/install

COPY ./package.json ./

# Installing only production dependencies to reduce size
RUN npm install --omit=dev --no-fund --no-audit --no-package-lock


#===============#
# RUNTIME IMAGE #
#===============#

FROM node:18-alpine

WORKDIR /opt/app

# Adding application files from build image
COPY --from=build /tmp/build/dist/ ./

# Adding installed dependencies from install image
COPY --from=install /tmp/install/node_modules/ ./node_modules/

# Copying manifest file
COPY ./package.json ./

ENTRYPOINT ["node", "cli.js"]
