import "./App.css";
import { gql, useMutation, useQuery } from "@apollo/client";
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

const GET_FILES = gql`
  query getUploads {
    getUploads {
      _id
      filename
      mimetype
      encoding
      data
    }
  }
`;

type File = {
  id: string;
  filename: string;
  mimetype: string;
  encoding: string;
  data: string;
};

function App() {
  const [singleUpload] = useMutation(MUTATION);
  const { data } = useQuery(GET_FILES);

  const onFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      singleUpload({ variables: { file } });
    }
  };

  console.log(data);

  return (
    <div>
      <button style={{ marginBottom: "1rem" }}>Upload File</button>
      <div>
        <input type="file" required onChange={onFileUpload} />
      </div>
      <div className="uploads">
        <h2>Uploaded Files</h2>
        {data &&
          data.getUploads &&
          data.getUploads.map((file: File) => (
            <li key={file.id}>
              <h3>{file.filename}</h3>
              <img
                src={`data:${file.mimetype};base64,${file.data}`}
                alt={file.filename}
                width={100}
              />
            </li>
          ))}
      </div>
    </div>
  );
}

export default App;
