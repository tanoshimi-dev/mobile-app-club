/**
 * SVG Icon Component
 * Drop-in replacement for @react-native-vector-icons/ionicons Icon
 */
import React from 'react';
import Svg, {Path, Circle} from 'react-native-svg';
import icons, {sadOutlineCircles} from './iconPaths';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

const Icon: React.FC<IconProps> = ({name, size = 24, color = '#000'}) => {
  const icon = icons[name];
  if (!icon) {
    return null;
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill={icon.stroke ? 'none' : color}
      stroke={icon.stroke ? color : 'none'}>
      {icon.paths.map((d, i) => (
        <Path
          key={i}
          d={d}
          fill={icon.stroke ? 'none' : color}
          stroke={icon.stroke ? color : 'none'}
          strokeWidth={icon.stroke ? icon.strokeWidth : undefined}
          strokeLinecap={icon.stroke ? 'round' : undefined}
          strokeLinejoin={icon.stroke ? 'round' : undefined}
        />
      ))}
      {name === 'sad-outline' &&
        sadOutlineCircles.map((c, i) => (
          <Circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} fill={color} />
        ))}
    </Svg>
  );
};

export default Icon;
