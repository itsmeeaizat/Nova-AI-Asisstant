import React from 'react';

interface TypewriterTextProps {
  content: string;
  isStreaming: boolean;
  renderFormatted: (text: string) => React.ReactNode;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  content,
  isStreaming,
  renderFormatted,
}) => {
  const [displayedText, setDisplayedText] = React.useState(isStreaming ? '' : content);
  const targetTextRef = React.useRef(content);
  targetTextRef.current = content;

  const charIndexRef = React.useRef(isStreaming ? 0 : content.length);

  React.useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content);
      charIndexRef.current = content.length;
      return;
    }

    // If streaming, animate typing character by character / word by word smoothly
    const interval = setInterval(() => {
      const currentTarget = targetTextRef.current;
      if (charIndexRef.current < currentTarget.length) {
        // Advance faster if lagging behind
        const diff = currentTarget.length - charIndexRef.current;
        const step = diff > 40 ? 6 : diff > 15 ? 3 : 1;
        charIndexRef.current = Math.min(currentTarget.length, charIndexRef.current + step);
        setDisplayedText(currentTarget.substring(0, charIndexRef.current));
      }
    }, 12);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // When streaming ends, ensure full content is shown
  React.useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content);
    }
  }, [isStreaming, content]);

  return <>{renderFormatted(displayedText)}</>;
};
