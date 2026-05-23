import { useEffect, useState } from "react";
import { EXTENSION_NAME } from "../shared/config";
import {
  DEFAULT_IMAGE_SELECTION,
  IMAGE_SET_OPTIONS,
  type ImageSetId,
  type ImageSelection,
} from "../shared/image-sets";
import { getImageSelection, setImageSelection } from "../shared/storage";
import "./popup.css";

function App() {
  const [selection, setSelection] = useState<ImageSelection>(
    DEFAULT_IMAGE_SELECTION,
  );

  useEffect(() => {
    void getImageSelection().then(setSelection);
  }, []);

  const handleChange =
    (imageSetId: ImageSetId) =>
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const nextSelection = {
        ...selection,
        [imageSetId]: event.target.checked,
      };

      setSelection(nextSelection);
      void setImageSelection(nextSelection);
    };

  return (
    <main className="popup">
      <h1>{EXTENSION_NAME}</h1>
      <fieldset className="group">
        <legend>Image sources</legend>
        {IMAGE_SET_OPTIONS.map((option) => (
          <label key={option.id} className="option">
            <input
              type="checkbox"
              checked={selection[option.id]}
              onChange={handleChange(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
    </main>
  );
}

export default App;
