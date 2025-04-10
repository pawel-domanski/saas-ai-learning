interface MarkdownProps {
  children: string;
}

export function Markdown({ children }: MarkdownProps) {
  return (
    <div className="prose prose-teal max-w-none">
      {children.split('\n').map((paragraph, index) => (
        <p key={index} className="mb-4 text-gray-700 leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
} 