const IconCatergoryMap = {
  image: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="currentColor"
    >
      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z" />
    </svg>
  ),
  video: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="currentColor"
    >
      <path d="M360-240h160q17 0 28.5-11.5T560-280v-40l80 42v-164l-80 42v-40q0-17-11.5-28.5T520-480H360q-17 0-28.5 11.5T320-440v160q0 17 11.5 28.5T360-240ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
    </svg>
  ),
  audio: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="currentColor"
    >
      <path d="M430-200q38 0 64-26t26-64v-150h120v-80H480v155q-11-8-23.5-11.5T430-380q-38 0-64 26t-26 64q0 38 26 64t64 26ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
    </svg>
  ),
  document: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="currentColor"
    >
      <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
    </svg>
  ),
  upload: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="currentColor"
    >
      <path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
    </svg>
  ),
};

const IconCategorizer = (fileName: string) => {
  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  if (
    fileExtension === "jpg" ||
    fileExtension === "jpeg" ||
    fileExtension === "png" ||
    fileExtension === "heic" ||
    fileExtension === "heif"
  ) {
    return IconCatergoryMap.image;
  } else if (
    fileExtension === "mp4" ||
    fileExtension === "mov" ||
    fileExtension === "avi" ||
    fileExtension === "mkv"
  ) {
    return IconCatergoryMap.video;
  } else if (
    fileExtension === "pdf" ||
    fileExtension === "doc" ||
    fileExtension === "docx" ||
    fileExtension === "txt" ||
    fileExtension === "zip" ||
    fileExtension === "pptx"
  ) {
    return IconCatergoryMap.document;
  } else if (
    fileExtension === "mp3" ||
    fileExtension === "wav" ||
    fileExtension === "flac" ||
    fileExtension === "aac"
  ) {
    return IconCatergoryMap.audio;
  } else {
    return IconCatergoryMap.upload;
  }
};

export default IconCategorizer;
