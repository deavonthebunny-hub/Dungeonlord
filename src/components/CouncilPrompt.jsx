

export default function CouncilPrompt(props) {
  const {
    attendCouncil,
    declineCouncil,
  } = props;

  return (
    <div className="councilPrompt">
                <div className="councilPromptCard">
                  <div className="councilPromptTitle">Council of the Dungeonlords</div>
                  <div className="muted">It is time for the Council to convene.</div>
                  <div className="row">
                    <button className="btn" onClick={attendCouncil}>
                      Attend
                    </button>
                    <button className="btn danger" onClick={declineCouncil}>
                      Decline
                    </button>
                  </div>
                </div>
              </div>
  );
}
