import { useQuery, gql, ssrExchange } from "urql";
import { useState, useEffect, useMemo } from "react";
import EditImagesModal from "../../../../components/Bucket/EditImagesModal";
import Bucket from "../../../../components/Bucket";
import Overview from "../../../../components/Bucket/Overview";
import { Tab } from "@headlessui/react";
import Funders from "components/Bucket/Funders";
import Comments from "components/Bucket/Comments";

import classNames from "utils/classNames";
import HappySpinner from "components/HappySpinner";
import { useRouter } from "next/router";
import { initUrqlClient } from "next-urql";
import { client as createClientConfig } from "graphql/client";
import prisma from "server/prisma";
import { TOP_LEVEL_QUERY } from "pages/_app";
import capitalize from "utils/capitalize";

export const BUCKET_QUERY = gql`
  query Bucket($id: ID) {
    bucket(id: $id) {
      id
      description
      summary
      title
      minGoal
      maxGoal
      income
      totalContributions
      totalContributionsFromCurrentMember
      approved
      published
      completed
      createdAt
      completedAt
      funded
      fundedAt
      canceled
      canceledAt
      noOfComments
      noOfFunders
      status

      directFundingEnabled
      directFundingType
      exchangeDescription
      exchangeMinimumContribution
      exchangeVat

      round {
        id
        slug
        color
        currency
        allowStretchGoals
        bucketReviewIsOpen
        requireBucketApproval
        directFundingEnabled
        directFundingTerms
        grantingIsOpen
        grantingHasClosed
        maxAmountToBucketPerUser
        guidelines {
          id
          title
          description
        }
        tags {
          id
          value
        }
        group {
          id
          slug
          discourseUrl
        }
      }
      funders {
        id
        amount
        createdAt
        roundMember {
          id
          user {
            id
            name
            username
          }
        }
      }
      tags {
        id
        value
      }
      raisedFlags {
        id
        comment
        guideline {
          id
          title
        }
      }
      customFields {
        id
        value
        customField {
          id
          name
          type
          limit
          description
          isRequired
          position
          createdAt
        }
      }
      cocreators {
        id

        user {
          id
          name
          username
          avatar
        }
      }
      images {
        id
        small
        large
      }
      discourseTopicUrl

      budgetItems {
        id
        description
        min
        max
        type
      }
    }
  }
`;

const BucketIndex = ({ currentUser, currentGroup }) => {
  const router = useRouter();
  const [{ data, fetching, error }] = useQuery({
    query: BUCKET_QUERY,
    variables: { id: router.query.bucket },
  });

  const [editImagesModalOpen, setEditImagesModalOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const { bucket } = data ?? { bucket: null };
  const showBucketReview =
    currentUser?.currentCollMember?.isApproved &&
    bucket?.round?.bucketReviewIsOpen &&
    bucket?.round?.guidelines.length > 0 &&
    bucket?.published;

  const tabsList = useMemo(() => ["bucket", "comments", "funders"], []);
  useEffect(() => {
    const index = tabsList.findIndex((tab) => tab === router.query.tab);
    setTab(index > -1 ? index : 0);
  }, [router.query.tab, tabsList]);

  if ((!bucket && fetching) || !router.isReady) {
    return (
      <div className="flex-grow flex justify-center items-center h-64">
        <HappySpinner />
      </div>
    );
  }

  if (!bucket && !fetching)
    return (
      <div className="text-center mt-7">
        This {process.env.BUCKET_NAME_SINGULAR} either doesn&apos;t exist or you
        don&apos;t have access to it
      </div>
    );

  if (error) {
    <div className="text-center mt-7">{error.message}</div>;
  }

  return (
    <>
      {/* EditImagesModal is here temporarily to work for both cover image and image thing, eventually we can make cover image its own thing. */}
      <EditImagesModal
        open={editImagesModalOpen}
        initialImages={bucket?.images}
        handleClose={() => setEditImagesModalOpen(false)}
        bucketId={bucket?.id}
      />
      <Overview
        bucket={bucket}
        fetching={fetching}
        error={error}
        currentUser={currentUser}
        currentGroup={currentGroup}
        showBucketReview={showBucketReview}
        openImageModal={() => setEditImagesModalOpen(true)}
      />
      <Tab.Group
        defaultIndex={tab}
        onChange={(tab) => {
          router.push(
            {
              pathname: router.pathname,
              query: { ...router.query, tab: tabsList[tab] },
            },
            undefined,
            { scroll: false }
          );
          setTab(tab);
        }}
      >
        <div className="bg-white border-b border-b-default">
          <Tab.List className="space-x-2 max-w-screen-xl mx-auto flex px-2 overflow-x-auto">
            <Tab
              className={({ selected }) =>
                classNames(
                  "block px-2 py-4 border-b-2 font-medium transition-colors",
                  selected
                    ? "border-anthracit text-anthracit"
                    : "border-transparent text-gray-500"
                )
              }
            >
              {capitalize(process.env.BUCKET_NAME_SINGULAR)}
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "block px-2 py-4 border-b-2 font-medium transition-colors",
                  selected
                    ? "border-anthracit text-anthracit"
                    : "border-transparent text-gray-500"
                )
              }
            >
              Comments{" "}
              {!bucket?.round?.group?.discourseUrl &&
                `(${bucket?.noOfComments})`}
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "block px-2 py-4 border-b-2 font-medium transition-colors",
                  selected
                    ? "border-anthracit text-anthracit"
                    : "border-transparent text-gray-500"
                )
              }
            >
              Funders ({bucket?.noOfFunders})
            </Tab>
          </Tab.List>
        </div>

        <Tab.Panels>
          <Tab.Panel>
            <Bucket
              bucket={bucket}
              currentUser={currentUser}
              openImageModal={() => setEditImagesModalOpen(true)}
            />
          </Tab.Panel>
          <Tab.Panel>
            <Comments
              bucket={bucket}
              router={router}
              currentUser={currentUser}
            />
          </Tab.Panel>
          <Tab.Panel>
            <Funders bucket={bucket} currentUser={currentUser} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </>
  );
};

// export async function getStaticProps(ctx) {
//   const ssrCache = ssrExchange({
//     isClient: false,
//   });
//   const client = initUrqlClient(createClientConfig(ssrCache), false);

//   // This query is used to populate the cache for the query
//   // used on this page.

//   await client
//     .query(TOP_LEVEL_QUERY, {
//       groupSlug: ctx.params.group,
//       roundSlug: ctx.params.round,
//       bucketId: ctx.params.bucket,
//     })
//     .toPromise();
//   await client.query(BUCKET_QUERY, { id: ctx.params.bucket }).toPromise();

//   return {
//     props: {
//       // urqlState is a keyword here so withUrqlClient can pick it up.
//       urqlState: ssrCache.extractData(),
//     },
//     revalidate: 60,
//   };
// }

// export async function getStaticPaths() {
//   const buckets = await prisma.bucket.findMany({
//     where: { publishedAt: { not: null }, round: { visibility: "PUBLIC" } },
//     include: { round: { include: { group: true } } },
//   });

//   return {
//     // paths: buckets.map((bucket) => ({
//     //   params: {
//     //     group: bucket.round.group.slug,
//     //     round: bucket.round.slug,
//     //     bucket: bucket.id,
//     //   },
//     // })),
//     paths: [],
//     fallback: true, // false or 'blocking'
//   };
// }

export default BucketIndex;
