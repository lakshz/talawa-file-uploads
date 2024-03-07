import "./App.css";
import { gql, useMutation } from "@apollo/client";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";

loadDevMessages();
loadErrorMessages();

import { ChangeEvent } from "react";

const MUTATION = gql`
  mutation ($file: Upload!) {
    singleUpload(file: $file) {
      filename
    }
  }
`;

function App() {
  const [singleUpload] = useMutation(MUTATION);

  const onFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      singleUpload({ variables: { file } });
    }
  };

  return (
    <div>
      <button style={{ marginBottom: "1rem" }}>Upload File</button>
      <div>
        <input type="file" required onChange={onFileUpload} />
      </div>
    </div>
  );
}

export default App;
