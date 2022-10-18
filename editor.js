import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import {
  schema,
  defaultMarkdownParser,
  defaultMarkdownSerializer,
} from "prosemirror-markdown";
import { exampleSetup } from "prosemirror-example-setup";

class Loader {
  constructor(editorState, editor) {
    this.editorState = editorState;
    this.editor = editor;
  }

  async loadAllPosts(div) {
    let editorState = this.editorState;
    let editor = this.editor;
    // fetch posts
    const container = document.querySelector(div);
    container.innerHTML = "";

    // fetch
    const r = await fetch("/posts").then((s) => s.json());
    r.forEach((post) => {
      let li = document.createElement("li");
      li.innerText = post.title;
      li.addEventListener("click", () => {
        currentPost = post;
        // highlight current stuff
        // here we update the editor state
        console.log(editorState);
        let newDocState = createMarkdownEditorState(post.content);
        editor.replaceState(newDocState);
      });
      container.appendChild(li);
    });
    console.log(r);
  }
}

class ProseMirrorView {
  constructor(editor) {
    let view = editor;
    this.view = view;
  }

  replaceState(editorState) {
    this.view.updateState(editorState);
  }

  get content() {
    return defaultMarkdownSerializer.serialize(this.view.state.doc);
  }
  focus() {
    this.view.focus();
  }
  destroy() {
    this.view.destroy();
  }
}

function createMarkdownEditorState(markdown) {
  return EditorState.create({
    doc: defaultMarkdownParser.parse(markdown),
    plugins: exampleSetup({ schema }),
  });
}

// global stuff

let place = document.querySelector("#editor");
let defaultContent = "# here we go";
const editorState = createMarkdownEditorState(defaultContent);

let editor = new EditorView(place, {
  dispatchTransaction: (tr) => {
    let newState = editor.state.apply(tr);

    let content = defaultMarkdownSerializer.serialize(newState.doc);
    console.log(content);
    if (currentPost) {
      console.log(`Sending stuff to ${currentPost.title}`);
      fetch("/posts", {
        method: "PUT",
        body: JSON.stringify({ ...currentPost, content: content }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      // TODO updating local caching as well -> currentPost, array of posts loaded above.
    }
    editor.updateState(newState);
  },
  state: editorState,
});
let proseView = new ProseMirrorView(editor);

// sending stuff to the current post
let currentPost = null;

// init loader
let loader = new Loader(editorState, proseView);
loader.loadAllPosts("#posts");
