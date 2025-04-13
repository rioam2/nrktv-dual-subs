export const TabList: React.FC<React.PropsWithChildren> = (props) => {
  return (
    <>
      {/* @ts-expect-error */}
      <player-settings-dialog-tabs
        className="display-block width-100% position-relative margin-bottom-m max-width-100%"
        style={{
          '--horizontal-list-gap': 0,
          '--horizontal-list-padding-left': 'var(--size-m)',
          '--horizontal-list-padding-right': 'var(--size-m)'
        }}
        role="tablist"
      >
        <div data-horizontal-list>
          {/* @ts-expect-error */}
          <u-tablist
            data-scroll-container
            role="tablist"
            className="display-grid grid-auto-flow-column overflow-auto overflow-y-hidden scrollbar-width-none"
            style={{
              '--horizontal-list-number-of-items': Array.isArray(props.children) ? props.children.length : 0,
              width: '100%',
              maxWidth: '500px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4
            }}
          >
            {props.children}
            {/* @ts-expect-error */}
          </u-tablist>
        </div>
        {/* @ts-expect-error */}
      </player-settings-dialog-tabs>
    </>
  );
};
