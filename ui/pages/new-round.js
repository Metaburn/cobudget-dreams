import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, gql } from "urql";
import Tooltip from "@tippyjs/react";
import Router from "next/router";
import Link from "next/link";

import slugify from "utils/slugify";
import currencies from "utils/currencies";
import TextField from "components/TextField";
import { SelectField } from "components/SelectInput";
import Button from "components/Button";
import { QuestionMarkIcon } from "components/Icons";
import toast from "react-hot-toast";
import PageHero from "../components/PageHero";

const CREATE_ROUND = gql`
  mutation CreateRound(
    $groupId: ID
    $title: String!
    $slug: String!
    $currency: String!
    $registrationPolicy: RegistrationPolicy!
  ) {
    createRound(
      groupId: $groupId
      title: $title
      slug: $slug
      currency: $currency
      registrationPolicy: $registrationPolicy
    ) {
      slug
      title
    }
  }
`;

export default function NewRoundPage({ currentGroup }) {
  const [, createRound] = useMutation(CREATE_ROUND);
  const { handleSubmit, register, errors } = useForm();
  const [slugValue, setSlugValue] = useState("");

  const onSubmit = (variables) => {
    createRound(variables).then(({ data, error }) => {
      if (error) {
        toast.error(
          error.message.includes("Unique constraint")
            ? "Slug is already taken"
            : error.message
        );
      } else {
        Router.push("/[group]/[round]", `/c/${data.createRound.slug}`);
      }
    });
  };

  return (
    <>
      {/* <PageHero>
        <h1 className="text-3xl font-semibold">New Round</h1>
      </PageHero> */}
      <div className="page">
        <div className="mx-auto max-w-md space-y-8 mt-10">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl mb-2 font-semibold">New Round</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <TextField
                name="title"
                label="Title"
                placeholder="Title"
                inputRef={register({ required: "Required" })}
                autoFocus
                className=""
                error={errors.title}
                helperText={errors.title?.message}
                inputProps={{
                  onChange: (e) => setSlugValue(slugify(e.target.value)),
                }}
              />
              <TextField
                name="slug"
                labelComponent={() => (
                  <div className="items-center flex">
                    Slug
                    <Tooltip
                      content={`The part that comes after the domain in the URL`}
                      placement="bottom"
                      arrow={false}
                    >
                      <QuestionMarkIcon className="ml-1 w-5 h-5 text-gray-600 hover:text-black" />
                    </Tooltip>
                  </div>
                )}
                placeholder="Slug"
                inputRef={register({ required: "Required" })}
                className=""
                error={errors.slug}
                helperText={errors.slug?.message}
                inputProps={{
                  value: slugValue,
                  onChange: (e) => setSlugValue(e.target.value),
                  onBlur: (e) => setSlugValue(slugify(e.target.value)),
                }}
              />
              <SelectField
                name="currency"
                label="Currency"
                className=""
                inputRef={register({
                  required: "Required",
                })}
              >
                {currencies.map((currency) => (
                  <option value={currency} key={currency}>
                    {currency}
                  </option>
                ))}
              </SelectField>
              <SelectField
                name="registrationPolicy"
                label="Registration policy"
                className=""
                inputRef={register({
                  required: "Required",
                })}
              >
                <option value="OPEN">Open</option>
                <option value="REQUEST_TO_JOIN">Request to join</option>
                <option value="INVITE_ONLY">Invite only</option>
              </SelectField>

              <Button className="" type="submit" fullWidth>
                Create
              </Button>
            </form>
          </div>
          <Link href="https://cobudget.com/">
            <a className="block mt-10 text-center rounded-lg border-2 border-red-400 px-6 py-4 font-semibold text-sm text-gray-600 bg-white cursor-pointer ">
              <span className="text-black">⚠️ WARNING: dreams.wtf comes with no support!</span>{" "}
              <span className="bg-red-400 rounded px-1 mr-0.5 text-white text-xs">
                GO TO COBUDGET.COM
              </span>{" "}
              This deployment of the Cobudget platform is only meant for experimental participatory events that are 100% volunteer run. 
              Some features on this version might be experimental or unfinished.
              Dreams.wtf comes with no support, and if you are using it for an event that pays anyone for their work, we ask you to use cobudget.com.
              If you would like a whitelabel version of Cobudget for your own organization, get in touch with hugi@cobudget.com to discuss options.
            </a>
          </Link>   
        </div>
      </div>
    </>
  );
}
