
export interface GithubCreateUpdateFileApiResponse {
    content: {
      name: string;
      path: string;
      sha: string;
      size: number;
      url: string;
      html_url: string;
      git_url: string;
      download_url: string | null;
      _links: {
        self: string;
        git: string;
        html: string;
      };
    };
    commit: {
      sha: string;
      url: string;
      html_url: string;
      author: {
        name: string;
        email: string;
        date: string;
      };
      committer: {
        name: string;
        email: string;
        date: string;
      };
      message: string;
      tree: {
        sha: string;
        url: string;
      };
      parents: {
        sha: string;
        url: string;
        html_url: string;
      }[];
    };
  }
  
export interface GithubGetFileApiResponse {
    type: string; // "file"
    encoding: string; // "base64"
    size: number;
    name: string;
    path: string;
    content: string; // base64-encoded content of the file
    sha: string;
    url: string;
    git_url: string;
    html_url: string;
    download_url: string | null;
    _links: {
      git: string;
      self: string;
      html: string;
    };
  }
  