import { getBundledAvatarCount } from "../shared/avatar-images";
import { DEBUG, EXTENSION_NAME } from "../shared/config";
import "./popup.css";

const avatarCount = getBundledAvatarCount();

function App() {
  return (
    <main className="popup">
      <h1>{EXTENSION_NAME}</h1>

      <dl className="meta">
        <div>
          <dt>Images</dt>
          <dd>{avatarCount}</dd>
        </div>
        <div>
          <dt>Debug</dt>
          <dd>{DEBUG ? "on" : "off"}</dd>
        </div>
      </dl>
    </main>
  );
}

export default App;
