

export default function LogPanel(props) {
  const {
    drawerPanelTitle,
    state,
  } = props;

  return (
    <section className="panel panel--log">
                      {drawerPanelTitle("Log")}
                      <div className="logScroll">
                        {state.log.map((l, idx) => (
                          <div className="logLine" key={idx}>
                            {l}
                          </div>
                        ))}
                      </div>
                    </section>
  );
}
