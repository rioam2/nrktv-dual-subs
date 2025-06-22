export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => {
  return (
    <select
      className="nrk-input"
      {...props}
      style={{
        width: '100%',
        backgroundColor: 'transparent',
        color: 'inherit',
        border: '1px solid #f0f0f0',
        padding: '0.5em 1em',
        borderRadius: '9999px',
        marginBottom: '1.5em',
        backgroundImage:
          'linear-gradient(45deg, rgba(0, 0, 0, 0) 46%, currentcolor 47%, currentcolor 49%, rgba(0, 0, 0, 0) 51%), linear-gradient(-45deg, rgba(0, 0, 0, 0) 46%, currentcolor 47%, currentcolor 49%, rgba(0, 0, 0, 0) 51%)',
        backgroundSize: '.36em 100%, .36em 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPositionX: 'calc(100% - 1.35em), calc(100% - 1em)',
        backgroundPositionY: 0,
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        ...props.style // Allow overriding styles
      }}
    >
      {props.children}
    </select>
  );
};
