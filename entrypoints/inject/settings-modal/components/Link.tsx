export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = (props) => {
  return (
    <a
      rel="noopener"
      target="_blank"
      style={{
        color: 'inherit',
        textDecorationStyle: 'dotted',
        fontStyle: 'italic',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4
      }}
      {...props}
    >
      {props.children}
    </a>
  );
};
