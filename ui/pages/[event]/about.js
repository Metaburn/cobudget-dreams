import About from "components/About";

export default ({ event, currentUser }) => {
  return (
    <div className="max-w-screen-md flex-1">
      <About event={event} currentUser={currentUser} />
    </div>
  );
};
