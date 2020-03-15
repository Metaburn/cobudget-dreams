import useForm from "react-hook-form";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import { useRouter } from "next/router";
import { TextField, Button, Modal } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import { DREAM_QUERY } from "../pages/[dream]";
import { TOP_LEVEL_QUERY } from "../pages/_app";
const useStyles = makeStyles(theme => ({
  modal: {
    display: "flex",
    padding: theme.spacing(1),
    alignItems: "center",
    justifyContent: "center"
  }
}));

const GIVE_GRANT = gql`
  mutation GiveGrant($dreamId: ID!, $value: Int!) {
    giveGrant(dreamId: $dreamId, value: $value) {
      value
    }
  }
`;

const GiveGrantlingsModal = ({
  open,
  handleClose,
  dream,
  event,
  currentMember
}) => {
  const classes = useStyles();
  const router = useRouter();

  const [giveGrant] = useMutation(GIVE_GRANT, {
    update(cache, { data: { giveGrant } }) {
      const { dream } = cache.readQuery({
        query: DREAM_QUERY,
        variables: { slug: router.query.dream, eventId: event.id }
      });

      cache.writeQuery({
        query: DREAM_QUERY,
        data: {
          dream: {
            ...dream,
            currentNumberOfGrants: dream.currentNumberOfGrants + giveGrant.value
          }
        }
      });

      const topLevelQueryData = cache.readQuery({
        query: TOP_LEVEL_QUERY,
        variables: { slug: event.slug }
      });

      cache.writeQuery({
        query: TOP_LEVEL_QUERY,
        data: {
          ...topLevelQueryData,
          currentMember: {
            ...topLevelQueryData.currentMember,
            availableGrants:
              topLevelQueryData.currentMember.availableGrants - giveGrant.value
          }
        }
      });
    }
  });
  const { handleSubmit, register, errors } = useForm();

  // TODO: show how many I have given
  // TODO: allow me to remove given grantlings

  return (
    <Modal open={open} onClose={handleClose} className={classes.modal}>
      <div className="p-5 bg-white rounded-lg shadow-md overflow-hidden outline-none">
        <h1 className="text-3xl mb-2 font-medium">Give grantlings to dream!</h1>
        <p>Available grants: {currentMember.availableGrants}</p>
        <form
          onSubmit={handleSubmit(variables => {
            giveGrant({
              variables: {
                dreamId: dream.id,
                value: Number(variables.value)
              }
            })
              .then(data => {
                // Add "Snackbar" success message from material UI
                handleClose();
              })
              .catch(error => {
                alert(error.message);
              });
          })}
        >
          <div className="my-3">
            <TextField
              name="value"
              defaultValue="1"
              inputRef={register}
              fullWidth
              inputProps={{
                type: "number",
                min: "1",
                max: `${currentMember.availableGrants}`
              }}
              variant="outlined"
            />
          </div>
          <Button
            type="submit"
            size="large"
            fullWidth
            variant="contained"
            color="primary"
          >
            Donate grantlings
          </Button>
        </form>
      </div>
    </Modal>
  );
};

export default GiveGrantlingsModal;
