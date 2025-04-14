export const Tab: React.FC<React.SelectHTMLAttributes<HTMLButtonElement>> = (props) => {
  return (
    <button
      type="button"
      role="tab"
      autoFocus
      aria-controls="player-settings-dialog-subtitles-tabpanel"
      className="selectable-button text-style-subhead1 selectable-button--icon-left margin-y-xxs"
      {...props}
    >
      {props.children}
    </button>
  );
};
