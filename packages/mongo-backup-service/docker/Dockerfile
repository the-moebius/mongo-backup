
# Using multistage build to produce minimal size application image

#==================#
# BUILD BASE IMAGE #
#==================#

FROM node:18-bullseye AS build-base

# Updating npm to the latest version
RUN npm install -g npm


#=============#
# BUILD IMAGE #
#=============#

FROM build-base AS build

WORKDIR /tmp/build

COPY              \
  ../src           \
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

COPY ../package.json ./

# Installing only production dependencies to reduce size
RUN npm install --omit=dev --no-fund --no-audit --no-package-lock


#===============#
# RUNTIME IMAGE #
#===============#

FROM node:18-bullseye

WORKDIR /opt/app

RUN wget -q -O /tmp/mongo-tools.deb https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian11-x86_64-100.6.1.deb \
  && dpkg -i /tmp/mongo-tools.deb \
  && rm /tmp/mongo-tools.deb

# Adding application files from build image
COPY --from=build /tmp/build/dist/ ./

# Adding installed dependencies from install image
COPY --from=install /tmp/install/node_modules/ ./node_modules/

# Copying manifest file
COPY ../package.json ./

ENTRYPOINT ["node", "cli.js"]
