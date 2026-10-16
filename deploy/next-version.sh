#!/bin/sh
# Prints the version this release should carry.
#
# Git tags are the source of truth, not a counter in the deploy target: the
# release history lives in GitLab (Deploy > Releases), and a rollback re-runs
# the pipeline on an existing tag rather than restoring an archive.
#
# How far the number moves is read from the commits since the last release:
#
#   BREAKING CHANGE: in a body, or a ! before the colon   major
#   feat:                                                 minor
#   anything else                                         patch
#
# A repository that does not write commits this way gets the patch counter,
# which is what every release did before this.
set -eu

RELEASE_TAG_PATTERN='^v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$'
FIRST_VERSION='1.0.1'

# Without git this would quietly return the first version on every release,
# collide with a tag that already exists, and fail somewhere less obvious.
command -v git > /dev/null 2>&1 || {
  echo "FATAL: git is required to read the last release tag" >&2
  exit 1
}

# Tags are not always fetched with the branch, and without them every release
# would look like the first one and reuse a version already published.
git fetch --tags --quiet 2>/dev/null || true

latest=$(git tag -l 'v*' | grep "$RELEASE_TAG_PATTERN" | sed 's/^v//' \
         | sort -t. -k1,1n -k2,2n -k3,3n | tail -1)

if [ -z "$latest" ]; then
  echo "no release tag yet -> $FIRST_VERSION" >&2
  echo "$FIRST_VERSION"
  exit 0
fi

# Only the commits this release adds. A `feat:` from two releases ago has
# already had its minor bump and must not earn another.
messages=$(git log --format='%B' "v${latest}..HEAD" 2>/dev/null || echo "")

if echo "$messages" | grep -Eqi '^BREAKING[ -]CHANGE:|^[a-z]+(\([^)]*\))?!:'; then
  bump=major
elif echo "$messages" | grep -Eq '^feat(\([^)]*\))?:'; then
  bump=minor
else
  bump=patch
fi

next=$(echo "$latest" | awk -F. -v bump="$bump" '
  {
    major = $1; minor = $2; patch = $3
    if (bump == "major")      { major += 1; minor = 0; patch = 0 }
    else if (bump == "minor") { minor += 1; patch = 0 }
    else                      { patch += 1 }
    print major "." minor "." patch
  }')

echo "release $latest -> $next ($bump)" >&2
echo "$next"
